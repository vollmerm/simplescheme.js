(define (tail_factorial i)
  (define (facthelp i prod)
    (if (= i 1) prod
        (facthelp (- i 1) (* i prod))))
  (facthelp i 1))

(define (fact_list x)
  (define (fact_list_tail i l)
    (if (= i 0) l
        (fact_list_tail (- i 1) (cons (tail_factorial i) l))))
  (fact_list_tail x '()))

(define (list_length l)
  (define (list_length_tail i s)
    (if (null? s) i
        (list_length_tail (+ i 1) (cdr s))))
  (list_length_tail 0 l))

(list_length (fact_list 100))
