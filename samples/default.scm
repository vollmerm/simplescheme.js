; factorial
(define (fact n)
  (if (<= n 1) 1
  (* n (fact (- n 1)))))

(fact 10)

; tail factorial
(define (helper-fact x y)
    (if (= x 0) y
        (helper-fact (- x 1) (* x y))))
(define (tail-fact n)
  (helper-fact n 1))
  
(= (tail-fact 10) (fact 10))

(tail-fact 100)

; higher order function
(define (isinlist L a)
  (if (null? L) #f
      (if (= a (car L)) #t
          (isinlist (cdr L) a))))

(isinlist '(1 2 3) 2)
(isinlist '(1 2 3) 4)

; boolean operations
(and #t #f) ; false
(and #t (or #t #f)) ; true